import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Advanced from '../advanced/index'

const UNITH_ORIGIN = 'https://chat-dev.unith.ai'

describe('Advanced Component', () => {
  let messageHandler: (event: MessageEvent) => void

  beforeEach(() => {
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'message') {
        messageHandler = handler as (event: MessageEvent) => void
      }
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders iframe with correct Unith dev URL', () => {
      render(<Advanced />)
      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.src).toContain('chat-dev.unith.ai')
      expect(iframe?.src).toContain('mode=video')
    })

    it('renders message input and controls', () => {
      render(<Advanced />)
      expect(screen.getByPlaceholderText('Enter message')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /generate video/i })).toBeInTheDocument()
      expect(screen.getByText('Video Controls')).toBeInTheDocument()
    })

    it('renders incoming messages section', () => {
      render(<Advanced />)
      expect(screen.getByText('Incoming Messages')).toBeInTheDocument()
    })

    it('button is disabled initially', () => {
      render(<Advanced />)
      const button = screen.getByRole('button', { name: /generate video/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Event Handling', () => {
    it('ignores messages from invalid origins', () => {
      render(<Advanced />)
      const button = screen.getByRole('button', { name: /generate video/i })

      act(() => {
        messageHandler({
          origin: 'https://malicious-site.com',
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      expect(button).toBeDisabled()
    })

    it('enables button when DH_READY event is received', () => {
      render(<Advanced />)
      const button = screen.getByRole('button', { name: /generate video/i })

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      expect(button).toBeEnabled()
    })

    it('handles DH_PROCESSING events', () => {
      render(<Advanced />)

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_PROCESSING', payload: { processing: true } },
        } as MessageEvent)
      })

      expect(screen.getByRole('button', { name: /generate video/i })).toBeDisabled()
      expect(screen.getByText(/generating video/i)).toBeInTheDocument()
    })
  })

  describe('Incoming Messages (DH_MESSAGE)', () => {
    it('displays incoming messages from avatar', () => {
      render(<Advanced />)

      // Make ready first
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      // Receive a message
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_MESSAGE', payload: { message: 'Hello from avatar!' } },
        } as MessageEvent)
      })

      expect(screen.getByText('Hello from avatar!')).toBeInTheDocument()
    })

    it('accumulates multiple incoming messages', () => {
      render(<Advanced />)

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_MESSAGE', payload: { message: 'First message' } },
        } as MessageEvent)
      })

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_MESSAGE', payload: { message: 'Second message' } },
        } as MessageEvent)
      })

      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
    })

    it('ignores DH_MESSAGE before iframe is ready', () => {
      render(<Advanced />)

      // Send message before ready
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_MESSAGE', payload: { message: 'Should not appear' } },
        } as MessageEvent)
      })

      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
    })
  })

  describe('Message Sending', () => {
    it('sends DH_MESSAGE via postMessage', () => {
      render(<Advanced />)

      const mockPostMessage = vi.fn()
      const iframe = document.querySelector('iframe')
      Object.defineProperty(iframe, 'contentWindow', {
        value: { postMessage: mockPostMessage },
        writable: true,
      })

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      const textarea = screen.getByPlaceholderText('Enter message')
      fireEvent.change(textarea, { target: { value: 'Test message' } })
      fireEvent.click(screen.getByRole('button', { name: /generate video/i }))

      expect(mockPostMessage).toHaveBeenCalledWith(
        { event: 'DH_MESSAGE', payload: { message: 'Test message' } },
        UNITH_ORIGIN
      )
    })

    it('clears input after sending', () => {
      render(<Advanced />)

      const mockPostMessage = vi.fn()
      const iframe = document.querySelector('iframe')
      Object.defineProperty(iframe, 'contentWindow', {
        value: { postMessage: mockPostMessage },
        writable: true,
      })

      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      const textarea = screen.getByPlaceholderText('Enter message') as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'Test' } })
      fireEvent.click(screen.getByRole('button', { name: /generate video/i }))

      expect(textarea.value).toBe('')
    })
  })
})

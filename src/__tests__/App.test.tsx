import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from '../App'

const UNITH_ORIGIN = 'https://chat.unith.ai'

describe('App Component', () => {
  let messageHandler: (event: MessageEvent) => void

  beforeEach(() => {
    // Capture the message event handler
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
    it('renders iframe with correct Unith URL', () => {
      render(<App />)
      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.src).toContain('chat.unith.ai')
      expect(iframe?.src).toContain('mode=video')
    })

    it('renders message input textarea', () => {
      render(<App />)
      const textarea = screen.getByPlaceholderText('Enter message')
      expect(textarea).toBeInTheDocument()
    })

    it('renders generate video button', () => {
      render(<App />)
      const button = screen.getByRole('button', { name: /generate video/i })
      expect(button).toBeInTheDocument()
    })

    it('button is disabled initially (before iframe ready)', () => {
      render(<App />)
      const button = screen.getByRole('button', { name: /generate video/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Event Handling', () => {
    it('ignores messages from invalid origins', () => {
      render(<App />)
      const button = screen.getByRole('button', { name: /generate video/i })

      // Send DH_READY from wrong origin
      act(() => {
        messageHandler({
          origin: 'https://malicious-site.com',
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      // Button should still be disabled
      expect(button).toBeDisabled()
    })

    it('enables button when DH_READY event is received', () => {
      render(<App />)
      const button = screen.getByRole('button', { name: /generate video/i })

      // Simulate DH_READY event from Unith
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      expect(button).toBeEnabled()
    })

    it('disables button and shows generating message when DH_PROCESSING is true', () => {
      render(<App />)

      // First make it ready
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      // Then start processing
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_PROCESSING', payload: { processing: true } },
        } as MessageEvent)
      })

      const button = screen.getByRole('button', { name: /generate video/i })
      expect(button).toBeDisabled()
      expect(screen.getByText(/generating video/i)).toBeInTheDocument()
    })

    it('re-enables button when DH_PROCESSING is false', () => {
      render(<App />)

      // Make ready, then processing, then done
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
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_PROCESSING', payload: { processing: false } },
        } as MessageEvent)
      })

      const button = screen.getByRole('button', { name: /generate video/i })
      expect(button).toBeEnabled()
      expect(screen.queryByText(/generating video/i)).not.toBeInTheDocument()
    })
  })

  describe('Message Sending', () => {
    it('sends DH_MESSAGE via postMessage when button clicked', () => {
      render(<App />)

      // Mock iframe contentWindow
      const mockPostMessage = vi.fn()
      const iframe = document.querySelector('iframe')
      Object.defineProperty(iframe, 'contentWindow', {
        value: { postMessage: mockPostMessage },
        writable: true,
      })

      // Make iframe ready
      act(() => {
        messageHandler({
          origin: UNITH_ORIGIN,
          data: { event: 'DH_READY', payload: { isReady: true } },
        } as MessageEvent)
      })

      // Type a message
      const textarea = screen.getByPlaceholderText('Enter message')
      fireEvent.change(textarea, { target: { value: 'Hello world' } })

      // Click generate
      const button = screen.getByRole('button', { name: /generate video/i })
      fireEvent.click(button)

      expect(mockPostMessage).toHaveBeenCalledWith(
        { event: 'DH_MESSAGE', payload: { message: 'Hello world' } },
        UNITH_ORIGIN
      )
    })

    it('clears input after sending message', () => {
      render(<App />)

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
      fireEvent.change(textarea, { target: { value: 'Test message' } })
      fireEvent.click(screen.getByRole('button', { name: /generate video/i }))

      expect(textarea.value).toBe('')
    })

    it('does not send empty messages', () => {
      render(<App />)

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

      // Leave textarea empty and click
      fireEvent.click(screen.getByRole('button', { name: /generate video/i }))

      expect(mockPostMessage).not.toHaveBeenCalled()
    })
  })
})

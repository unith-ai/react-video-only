import { useEffect, useRef, useState } from "react";

const UNITH_ORIGIN = "https://chat-dev.unith.ai";
function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [value, setValue] = useState("");

  const handleReadyState = (payload: any) => {
    if (payload && payload.isReady) {
      setIsReady(true);
    }
  };

  const handleEvent = (event: MessageEvent) => {
    if (event.origin !== UNITH_ORIGIN) return;
    const payload = event.data.payload;
    const name = event.data.event;

    switch (name) {
      case "DH_READY":
        handleReadyState(payload);
        break;
      case "DH_PROCESSING":
        handleProcessingState(payload);
        break;
    }
  };

  const handleProcessingState = (payload: any) => {
    if (!isReady) return;
    if (payload && payload.processing) {
      setIsGenerating(true);
    } else {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = () => {
    const message = value.trim();
    if (!message || !isReady) return;

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        event: "DH_MESSAGE",
        payload: { message },
      },
      UNITH_ORIGIN
    );
    setValue("");
  };

  useEffect(() => {
    window.addEventListener("message", handleEvent);
    return () => {
      window.removeEventListener("message", handleEvent);
    };
  });

  return (
    <section className="parent">
      <iframe
        ref={iframeRef}
        id="talkingHeadsIframe"
        src="https://chat-dev.unith.ai/asdf-171/police-13449?api_key=9220ac63f8204991b9b88dbc7e3ecb2f&mode=video"
        width="75%"
        height="100%"
        allow="microphone"
      ></iframe>
      <div>
        <textarea
          className="form-control"
          id="messageInput"
          placeholder="Enter message"
          rows={3}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        ></textarea>

        <button
          disabled={!isReady || isGenerating}
          className="send-button btn btn-primary btn-disabled my-4"
          onClick={handleSendMessage}
        >
          Generate video
        </button>
        {isGenerating ? (
          <p className="alert alert-primary p-2">Generating video....</p>
        ) : (
          <></>
        )}
      </div>
    </section>
  );
}

export default App;

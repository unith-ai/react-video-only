
import { useEffect, useRef, useState } from "react";


const UNITH_ORIGIN = "https://chat-dev.unith.ai";
const Advanced: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [value, setValue] = useState("");
    const [messages, setMessages] = useState<string[]>([]);


    const handleReadyState = (payload: { isReady: boolean }) => {
        if (payload && payload.isReady) {
            setIsReady(true);
        }
    };


    const handleProcessingState = (payload: { processing: boolean }) => {
        if (!isReady) return;
        if (payload && payload.processing) {
            setIsGenerating(true);
        } else {
            setIsGenerating(false);
        }
    };

    const handleNewMessage = (payload: { message: string }) => {
        if (!isReady) return;
        if (payload && payload.message) {
            setMessages((prevMessages) => [...prevMessages, payload.message]);
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
            case "DH_MESSAGE":
                handleNewMessage(payload);
                break;
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

    useEffect(() => {
        console.log({ isGenerating, isReady })
    }, [isReady, isGenerating])


    return (
        <section className="parent">
            <iframe
                ref={iframeRef}
                id="talkingHeadsIframe"
                src="https://chat-dev.unith.ai/asdf-171/chrisbrown-13424?api_key=9220ac63f8204991b9b88dbc7e3ecb2f&mode=video&welcome_button_text=custom text here&welcome_message=null"
                width="75%"
                height="100%"
                allow="microphone"
            ></iframe>
            <div>
                <h3>Video Controls</h3>
                <label htmlFor="messageInput"> Message: </label>
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

                <div className="message-list">
                    <h3>Incoming Messages</h3>
                    {
                        messages.map((message, index) => (
                            <div key={index} className="message">
                                {message}
                            </div>
                        ))}
                </div>
            </div>
        </section>
    );
};

export default Advanced;
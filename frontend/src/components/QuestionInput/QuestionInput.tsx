import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import Microphone from "../../assets/Microphone.svg";
import styles from "./QuestionInput.module.css";

interface Props {
    onSend: (question: string, id?: string) => void;
    disabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
    conversationId?: string;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId }: Props) => {
    const [question, setQuestion] = useState<string>("");

    ///////////////////
    //  Speech to Text!

    // Define variables
    let isListening: boolean = false;
    let latestTranscript: string;
    const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechRecognition = new recognition();
    const [isClicked, setIsClicked] = useState(false);
    
    speechRecognition.continuous = true; // Add this line
    
    speechRecognition.onstart = () => {
        isListening = true;
    };

    speechRecognition.onend = () => {
        isListening = false;
        setIsClicked(!isClicked);
    };
    
    speechRecognition.onresult = (event: { results: Iterable<unknown> | ArrayLike<unknown>; }) => {
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

        // Ensure transcript is not duplicated   
        if (latestTranscript != transcript && transcript != "") {

            console.log(transcript);
            setQuestion(transcript);
            latestTranscript = transcript;

        }


    };
    
    const toggleListen = () => {

        console.log("State:" , isListening);

        // If not listening already, start listening
        if (!isListening) {

            console.log("Is Not Listening");

            // Start recognising speech
            speechRecognition.start();

            setIsClicked(!isClicked); // Toggle the clicked state

        } else {

            console.log("Is Listening");

            speechRecognition.abort();
            speechRecognition.stop();
            isListening = false;

            console.log("Listening set to False");

            setIsClicked(isClicked); // Toggle the clicked state

        }

    }; // Speech to text
    ////////////////////

    const sendQuestion = () => {
        if (disabled || !question.trim()) {
            return;
        }

        if(conversationId){
            onSend(question, conversationId);
        }else{
            onSend(question);
        }

        if (clearOnSend) {
            setQuestion("");
        }
    };

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (ev.key === "Enter" && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
            ev.preventDefault();
            sendQuestion();
        }
    };

    const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setQuestion(newValue || "");
    };

    const sendQuestionDisabled = disabled || !question.trim();

    // I need to input the text from the audio into the TextField
    return (
        <Stack horizontal className={styles.questionInputContainer}>
            
            <TextField
                className={styles.questionInputTextArea}
                placeholder={placeholder}
                multiline
                resizable={false}
                borderless
                value={question}
                onChange={onQuestionChange}
                onKeyDown={onEnterPress}
            />
            <div className={styles.questionInputSendButtonContainer}
                role="button" 
                tabIndex={0}
                aria-label="Ask question button"
                onKeyDown={e => e.key === "Enter" || e.key === " " ? sendQuestion() : null}
            >
                <div className="button-container">
                    { isClicked ? 
                        <img src={Microphone} className={styles.questionInputMicrophoneButtonClicked} onClick={toggleListen}/>
                        :
                        <img src={Microphone} className={styles.questionInputMicrophoneButton} onClick={toggleListen}/>
                    }
                    { sendQuestionDisabled ? 
                        <SendRegular className={styles.questionInputSendButtonDisabled}/>
                        :
                        <img src={Send} className={styles.questionInputSendButton} onClick={sendQuestion}/>
                    }
                </div>
            </div>
            <div className={styles.questionInputBottomBorder} />
        </Stack>
    );
};

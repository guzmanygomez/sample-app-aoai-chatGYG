import { useState } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import Record from "../../assets/Record.svg";
import RecordDisabled from "../../assets/RecordDisabled.svg";
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

    // Define variables
    let latestTranscript: string;

    // Specify constant to check if the microphone is recording
    const [recording, setRecording] = useState(false);

    // Specify constant to check if the microphone is recording
    const [stoppingAudio, setStoppingAudio] = useState(false);

    // Configure Speech Recognition
    const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechRecognition = new recognition();
    speechRecognition.continuous = false;

    const MAX_SILENCE_DURATION = 8000; // Maximum duration of silence in milliseconds
    let silenceTimer: number | null = null;
    
    // Handle when the speech recognition starts
    speechRecognition.onstart = () => {

        // Check if is already recording
        if (speechRecognition.isRecording) {
            console.log("Did not start recording. Already recording.");
            setRecording(true);
            return;
        }

        setRecording(true);
        console.log('Speech recognition started');

        // Start the silence timer when recognition starts
        silenceTimer = window.setTimeout(() => {
            console.log('Maximum silence duration reached. Stopping recognition.');
            speechRecognition.stop(); // Stop recognition if there's no speech input after the timeout
        }, MAX_SILENCE_DURATION);

        
    };

    // Handle when the speech recognition stops
    speechRecognition.onend = () => {

        console.log('Speech recognition stopped');
        setRecording(false);
        setStoppingAudio(false);

        // Clear the silence timer when recognition ends
        if (silenceTimer !== null) {
            window.clearTimeout(silenceTimer);
            silenceTimer = null;
        }

    };
    
    // Handle when the speech recognition results are available
    speechRecognition.onresult = (event: { results: Iterable<unknown> | ArrayLike<unknown>; }) => {
        
        const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

        // Ensure transcript is not duplicated   
        if (latestTranscript !== transcript && transcript !== "") {

            console.log(transcript);
            setQuestion(transcript);
            latestTranscript = transcript;

        }

        // Reset the silence timer whenever speech is recognized
        if (silenceTimer !== null) {
            window.clearTimeout(silenceTimer);
            silenceTimer = window.setTimeout(() => {
                console.log('Maximum silence duration reached. Stopping recognition.');
                speechRecognition.stop(); // Stop recognition if there's no speech input after the timeout
            }, MAX_SILENCE_DURATION);
        }

    };
    
    // When Microhone button is clicked
    const toggleListen = () => {

        console.log("State:" , recording);

        // If not listening already, start listening
        if (!recording) {

            console.log("Is Not Listening");

            speechRecognition.start();


        } else {

            console.log("Is Listening");

            setStoppingAudio(true);

            speechRecognition.stop();

            console.log("Listening set to False");

        }

    };

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

    return (
        <div>
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
                    { sendQuestionDisabled ? 
                        <SendRegular className={styles.questionInputSendButtonDisabled}/>
                        :
                        <img src={Send} className={styles.questionInputSendButton} onClick={sendQuestion}/>
                    }
                </div>
            </div>
            <div className={styles.questionInputBottomBorder} />
        </Stack>
        <Stack horizontal className={styles.audioInputContainer}>
            <p className={styles.someTextStyle}>
                {   recording ?
                        stoppingAudio? 
                            <img src={RecordDisabled} className={styles.audioButtonStyle} onClick={toggleListen}/>
                            :
                            <img src={Record} className={`${styles.audioButtonStyle} ${styles.blinking}`} onClick={toggleListen}/>
                    :
                    <img src={Microphone} className={styles.audioButtonStyle} onClick={toggleListen}/>
                }
            </p>
        </Stack>
        </div>
    );
    
};
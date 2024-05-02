import { useState, useEffect} from "react";
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
    const [isListening, setIsListening] = useState<boolean>(false);
    const [recording, setRecording] = useState<boolean>(false);
    const [stoppingAudio, setStoppingAudio] = useState<boolean>(false);
    const [latestTranscript, setLatestTranscript] = useState<string>("");
    const [speechRecognition, setSpeechRecognition] = useState<any>(null);
    const KEYWORD: string = "gomez";

    useEffect(() => {
        const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const speechRecognitionInstance = new recognition();
        speechRecognitionInstance.continuous = false;
        setSpeechRecognition(speechRecognitionInstance);
    }, []);

    const toggleListen = () => {
        if (!isListening) {
            startListening();
        } else {
            stopListening();
            setStoppingAudio(false);
        }
    };

    const startListening = () => {
        if (speechRecognition) {
            setIsListening(true);
        }
    };

    const startRecording = () => {
        if (speechRecognition) {
            speechRecognition.start();
            setRecording(true);
            console.log("Recording started...");
        }
    };

    const stopRecording = () => {
        if (speechRecognition) {
            speechRecognition.stop();
            setRecording(false);
            console.log("Recording stopped...");
        }
    };

    const stopListening = () => {
        if (speechRecognition) {
            // PENDING:
            //speechRecognition.stop();
            //setRecording(false);
            //
            setIsListening(false);
            setStoppingAudio(true);
        }
    };
    
    useEffect(() => {

        if (!speechRecognition) return;

        speechRecognition.onstart = () => {
            setRecording(true);
        };

        speechRecognition.onend = () => {
            speechRecognition.start();
            console.log("OnEnd: Speech recognition restarted...");
            /*
            if (!stoppingAudio) {
                startListening();
            } else {
                setRecording(false);
            }
            setStoppingAudio(false); */
        };
    
        // Handle when the speech recognition results are available
        speechRecognition.onresult = (event: any) => {

            console.log("OnResult: isListening State:", isListening);

            // Get the transcript from the event
            const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

            // Ensure transcript is not duplicated   
            if (latestTranscript !== transcript && transcript !== "") {

                    console.log("OnResult: Transcript:", transcript);

                    // Check if service is listening and not just recording
                    if (isListening) {

                        // When listening, set the question to the transcript
                        setQuestion(transcript);

                        // Delay 3 seconds and then send
                        setTimeout(() => {
                            // Your command to execute after 3 seconds
                            console.log("Sending question after 3 seconds");
                            if (!question.trim()) {
                                sendQuestion(transcript);
                            }
                            
                        }, 3000);

                        

                        console.log("OnResult: Setting question to transcript...");

                    } else {

                        // When not listening, check if the transcript contains the keyword
                        if (transcript.toLowerCase().includes(KEYWORD)) {
                            console.log("OnResult: Keyword detected, starting recording...");
                            try {

                                //listening = true;
                            // console.log("OnResult: Listening is false. Current state now: " + listening);

                                setIsListening(true);
                                console.log("OnResult: isListening is false. Current state now: " + isListening);

                            } catch (error) {

                                console.error('OnResult: Error setting Listening status:', error);
                            }
                            
                            
                        } 

                    }

                    //
                    setLatestTranscript(transcript);
            }

        };

        console.log("UseEffect: Speech recognition event listeners initialized...");

    }, [speechRecognition, isListening, recording, stoppingAudio]);

    const sendQuestion = (questionToSend: string) => {
        // Check if the question to send is empty or only contains whitespace
        if (!questionToSend.trim()) {
            console.log("Question is empty or contains only whitespace.");
            return;
        }
    
        // Send the question
        if (conversationId) {
            onSend(questionToSend, conversationId);
        } else {
            onSend(questionToSend);
        }
    
        // Clear the question if clearOnSend is true
        if (clearOnSend) {
            setQuestion("");
        }
    
        // Set isListening to false
        setIsListening(false);
    };
    

    const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
        if (ev.key === "Enter" && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
            ev.preventDefault();
            sendQuestion(question);
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
                onKeyDown={e => e.key === "Enter" || e.key === " " ? sendQuestion(question) : null}
            >
                <div className="button-container">
                    { sendQuestionDisabled ? 
                        <SendRegular className={styles.questionInputSendButtonDisabled}/>
                        :
                        <img src={Send} className={styles.questionInputSendButton} onClick={() => sendQuestion(question)}/>
                    }
                </div> 
            </div>
            <div className={styles.questionInputBottomBorder} />
        </Stack>
        <Stack horizontal className={styles.audioInputContainer}>
            <p className={styles.someTextStyle}>
                { isListening ?
                        stoppingAudio? 
                            <img src={RecordDisabled} className={styles.audioButtonStyle} onClick={toggleListen}/>
                            :
                            <img src={Record} className={`${styles.audioButtonStyle} ${styles.blinking}`} onClick={toggleListen}/>
                    :
                    <img src={Microphone} className={styles.audioButtonStyle} onClick={toggleListen}/>
                }
            </p>
        </Stack>
        <Stack horizontal className={styles.hiddenButtonContainer}>
            <p className={styles.someTextStyle}>
                <button style={{ fontFamily: "sini" }} className={styles.hiddenButtonStyle} onClick={startRecording}>ENABLE MICROPHONE</button>
            </p>
        </Stack>
        </div>
    );

};
import { useState, useEffect } from "react";
import { Stack, TextField } from "@fluentui/react";
import { SendRegular } from "@fluentui/react-icons";
import Send from "../../assets/Send.svg";
import Record from "../../assets/Record.svg";
import RecordDisabled from "../../assets/RecordDisabled.svg";
import Microphone from "../../assets/Microphone.svg";
import Audio from "../../assets/Audio.svg";
import AudioDisabled from "../../assets/AudioDisabled.svg";
import NoAudio from "../../assets/NoAudio.svg";
import styles from "./QuestionInput.module.css";

interface Props {
    onSend: (question: string, id?: string) => void;
    disabled: boolean;
    placeholder?: string;
    clearOnSend?: boolean;
    conversationId?: string;
    onAudioPause: () => void;
    onAudioResume: () => void;
    isPlayingAudio: boolean;
    isAudioDisabled: boolean;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const QuestionInput = ({ onSend, disabled, placeholder, clearOnSend, conversationId, onAudioPause, onAudioResume, isPlayingAudio, isAudioDisabled }: Props) => {

    const [question, setQuestion] = useState<string>("");
    const [isListening, setIsListening] = useState<boolean>(false);
    const [recording, setRecording] = useState<boolean>(false);
    const [stoppingAudio, setStoppingAudio] = useState<boolean>(false);
    const [latestTranscript, setLatestTranscript] = useState<string>("");
    const [speechRecognition, setSpeechRecognition] = useState<any>(null);
    const [isDoneAutoListen, setIsDoneAutoListen] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const KEYWORD: string = "gomez";

    useEffect(() => {
        const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const speechRecognitionInstance = new recognition();
        speechRecognitionInstance.continuous = true;
        //speechRecognitionInstance.interimResults = true;
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
        if (!recording) {
            startRecording();
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
            // Do not restart microphone if audio is playing
            if (!isPlayingAudio) {
                startRecording();
                console.log("OnEnd: Speech recognition restarted... isPlayingAudio: " + isPlayingAudio);
            } else {
                setRecording(false);
                console.log("OnEnd: Speech recognition didn't restart... isPlayingAudio: " + isPlayingAudio);
            }
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
                        // Your command to execute after a few seconds
                        console.log("Sending question after 2.5 seconds");
                        if (!question.trim()) {
                            sendQuestion(transcript);
                            // Remove ?
                            // Flush audio
                            speechRecognition.stop();
                        }

                    }, 2500);

                    console.log("OnResult: Setting question to transcript...");

                } else {

                    // When not listening, check if the transcript contains the keyword
                    if (transcript.toLowerCase().includes(KEYWORD)) {
                        console.log("OnResult: Keyword detected, starting recording...");

                        try {
                            
                            // Start recording
                            setIsListening(true);
                            console.log("OnResult: isListening is false. Current state now: " + isListening);

                            // Remove ?
                            // Flush audio
                            //
                            speechRecognition.stop();

                        } catch (error) {

                            console.error('OnResult: Error setting Listening status:', error);
                        }


                    }

                }

                // 
                setLatestTranscript(transcript);
                //speechRecognition.stop()
            }

        };

    }, [speechRecognition, isListening, recording, stoppingAudio, isPlayingAudio]);

    // Play Audio Automatically
    useEffect(() => {
        if (!isDoneAutoListen && speechRecognition) {
            setIsDoneAutoListen(true);
            startRecording();
        }
    }, [isDoneAutoListen, speechRecognition])

    // Pause audio when listening is enabled 
    useEffect(() => {
        if (isListening) {
            onAudioPause();
        }

        if (!isPlayingAudio && !recording) {
            console.log("Recording state is: " + recording);
            startRecording();
        }

    }, [isListening, isPlayingAudio, recording]);

    const sendQuestion = (questionToSend: string) => {

        // Set Loading Audio
        setIsLoadingAudio(true);

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

        // Stop audio
        onAudioPause();
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
                        {   isAudioDisabled ?
                                isLoadingAudio ?
                                    <img src={AudioDisabled} className={`${styles.audioPlayerButtonStyle} ${styles.blinking}`} />
                                    :
                                    <img src={AudioDisabled} className={styles.audioPlayerButtonStyle} />
                                :
                                isPlayingAudio ?
                                    <img src={Audio} className={styles.audioPlayerButtonStyle} onClick={onAudioPause} />
                                    :
                                    <img src={NoAudio} className={styles.audioPlayerButtonStyle} onClick={onAudioResume}  />
                        }
                        { sendQuestionDisabled ?
                            <SendRegular className={styles.questionInputSendButtonDisabled} />
                            :
                            <img src={Send} className={styles.questionInputSendButton} onClick={() => sendQuestion(question)} />
                        }
                    </div>
                </div>
                <div className={styles.questionInputBottomBorder} />
            </Stack>
            <Stack horizontal className={styles.audioInputContainer}>
                <p className={styles.someTextStyle}>
                    {isListening ?
                        stoppingAudio ?
                            <img src={RecordDisabled} className={styles.audioButtonStyle} onClick={toggleListen} />
                            :
                            <img src={Record} className={`${styles.audioButtonStyle} ${styles.blinking}`} onClick={toggleListen} />
                        :
                        <img src={Microphone} className={styles.audioButtonStyle} onClick={toggleListen} />
                    }
                </p>
            </Stack>
        </div>
    );

};
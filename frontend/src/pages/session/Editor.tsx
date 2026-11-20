import { useParams } from 'react-router';

export default function Editor() {
    const { sessionId } = useParams<{ sessionId: string }>();
    return (
        <main>
            <h1>Editor</h1>
            <p>Session: {sessionId}</p>
            {/* your code editor / collaboration logic goes here */}
        </main>
    );
}
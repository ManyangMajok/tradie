import { Logo } from '../Components/ui/Logo';

export default function Welcome() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
            <Logo size="lg" showTagline />
            <p className="mt-3 text-lg text-gray-500">Coming soon</p>
        </div>
    );
}

import SSHForm from "@/components/SSHForm.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { State } from "@/types/state.ts";

interface FormPageProps {
    setIsConnected: (state: State) => void;
}

export default function FormPage(props: FormPageProps) {
    const { setIsConnected } = props;
    return (
            <div className='flex flex-col items-center justify-center min-h-screen'>
                <Card
                        className="w-full max-w-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl border-gray-200 dark:border-gray-800">
                    <CardHeader className="text-center space-y-2">
                        <div
                                className="mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 p-1 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                                 viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round" className="text-white">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <line x1="9" x2="15" y1="15" y2="15"/>
                            </svg>
                        </div>
                        <CardTitle
                                className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            Container Flow
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            Manage your Docker containers easily and efficiently
                        </CardDescription>
                    </CardHeader>

                    <Separator className="my-2"/>

                    <CardContent className="pt-6">
                        <SSHForm setIsConnected={setIsConnected}/>
                    </CardContent>

                    <CardFooter className="flex justify-center text-xs text-gray-500 pt-4">
                        <p>© 2025 Container Flow - Simplified Docker Management</p>
                    </CardFooter>
                </Card>
            </div>
    );
}
import SSHForm from "@/components/SSHForm.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { State } from "@/types/state.ts";
import ContainerFlowSvg from '../../assets/icons/container-flow.svg';

interface FormPageProps {
    setIsConnected: (state: State) => void;
}

export default function FormPage(props: FormPageProps) {
    const { setIsConnected } = props;
    return (
            <Card className="w-full max-w-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl border-gray-200 dark:border-gray-800">
                <CardHeader className="text-center space-y-2 flex flex-col items-center justify-center">
                        <img src={ContainerFlowSvg} alt="Container Flow" className="w-20 h-20"/>
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

                <CardFooter className="flex justify-center text-center text-xs text-gray-500 pt-4">
                    <p>© 2025 Container Flow - Simplified Docker Management</p>
                </CardFooter>
            </Card>
    );
}
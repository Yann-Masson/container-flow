'use client';

import { useEffect, useState } from 'react';
import { ContainerInfo } from 'dockerode';
import { DockerClientService } from "../docker/docker-client.ts";
import { State } from "../types/state.ts";

export default function ListContainers() {
    const [state, setState] = useState(State.LOADING);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const dockerClientService = new DockerClientService();

    // List containers
    const handleListContainers = async () => {
        setState(State.LOADING);
        setError('');
        setMessage('');

        try {
            const containers = await dockerClientService.containers.list();

            if (containers) {
                setContainers(containers);
                setMessage(`${containers.length} container(s) found`);
                setState(State.SUCCESS);
            } else {
                setError('Error retrieving containers');
                setState(State.ERROR);
            }
        } catch (error) {
            setError(`Error: ${error}`);
            setState(State.ERROR);
        }
    };

    useEffect(() => {
        // Automatically list containers when component mounts
        handleListContainers().then();
    }, []);

    return (
            <div className='p-4'>
                <h1 className='text-2xl font-bold mb-4'>Docker Manager</h1>

                { /* Connection status message */}
                {state === State.SUCCESS && (
                        <div className='text-green-600'>{message}</div>
                )}

                {state === State.ERROR && (
                        <div className='text-red-600'>{error}</div>
                )}

                {/* Connection status */}
                {state === State.LOADING && (
                        <div className='text-blue-600'>Loading...</div>
                )}

                {/* Container list */}
                {state === State.SUCCESS && containers.length > 0 && (
                        <div className='mt-6'>
                            <h2 className='text-xl font-bold mb-3'>Containers</h2>
                            <div className='overflow-x-auto'>
                                <table className='min-w-full border'>
                                    <thead className=''>
                                    <tr>
                                        <th className='py-2 px-4 border'>ID</th>
                                        <th className='py-2 px-4 border'>Name</th>
                                        <th className='py-2 px-4 border'>Image</th>
                                        <th className='py-2 px-4 border'>Status</th>
                                        <th className='py-2 px-4 border'>
                                            Created
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {containers.map((container) => (
                                            <tr key={container.Id}>
                                                <td className='py-2 px-4 border'>
                                                    {container.Id.substring(0, 12)}
                                                </td>
                                                <td className='py-2 px-4 border'>
                                                    {container.Names.join(', ').replace(
                                                            /^\//,
                                                            '',
                                                    )}
                                                </td>
                                                <td className='py-2 px-4 border'>
                                                    {container.Image}
                                                </td>
                                                <td className='py-2 px-4 border'>
                                                    {container.Status}
                                                </td>
                                                <td className='py-2 px-4 border'>
                                                    {new Date(
                                                            container.Created * 1000,
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                )}
            </div>
    );
}

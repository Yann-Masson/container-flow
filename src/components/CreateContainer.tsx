'use client';

import { useState } from 'react';
import { ContainerCreateOptions } from 'dockerode';
import { State } from "../types/state.ts";
import { DockerClientService } from "../docker/docker-client.ts";

interface Props {
    containerOptions: ContainerCreateOptions;
}

export default function CreateContainer(props: Props) {
    const { containerOptions } = props;

    const [state, setState] = useState(State.IDLE);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const dockerClientService = new DockerClientService();

    // List containers
    const onSubmit = async () => {
        setState(State.LOADING);
        setError('');
        setMessage('');

        try {
            const response =
                    await dockerClientService.containers.create(containerOptions);

            if (response) {
                setMessage(`Container created successfully: ${response.Id}`);
                setState(State.SUCCESS);
            } else {
                setState(State.ERROR);
            }
        } catch (error) {
            setError(`Error: ${error}`);
            setState(State.ERROR);
        }
    };

    return (
            <div className='p-4'>
                <h1 className='text-2xl font-bold mb-4'>
                    Create {containerOptions.Image} Container
                </h1>
                <button
                        onClick={onSubmit}
                        className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
                >
                    Create {containerOptions.Image} Container
                </button>

                {state === State.LOADING && (
                        <div className='text-blue-600'>Creating container...</div>
                )}
                {state === State.SUCCESS && (
                        <div className='text-green-600'>{message}</div>
                )}
                {state === State.ERROR && (
                        <div className='text-red-600'>{error}</div>
                )}
            </div>
    );
}

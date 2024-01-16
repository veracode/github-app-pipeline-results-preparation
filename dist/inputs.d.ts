import { InputOptions } from '@actions/core';
type GetInput = (name: string, options?: InputOptions | undefined) => string;
interface Inputs {
    token: string;
}
export declare const parseInputs: (getInput: GetInput) => Inputs;
export {};

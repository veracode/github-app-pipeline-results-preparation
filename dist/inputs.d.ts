import { InputOptions } from '@actions/core';
type GetInput = (name: string, options?: InputOptions | undefined) => string;
type Inputs = {
    token: string;
    vid: string;
    vkey: string;
    check_run_id: number;
    appname: string;
    source_repository: string;
    event_trigger: string;
};
export declare const parseInputs: (getInput: GetInput) => Inputs;
export {};

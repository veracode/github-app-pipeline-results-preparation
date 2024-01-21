import { InputOptions } from '@actions/core';
type GetInput = (name: string, options?: InputOptions | undefined) => string;
type Actions = 'getPolicyNameByProfileName' | 'preparePipelineResults';
type Inputs = {
    action: Actions;
    vid: string;
    vkey: string;
    appname: string;
    token: string;
    check_run_id: number;
    source_repository: string;
};
export declare const parseInputs: (getInput: GetInput) => Inputs;
export {};

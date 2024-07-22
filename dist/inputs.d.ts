import { InputOptions } from '@actions/core';
type GetInput = (name: string, options?: InputOptions | undefined) => string;
export declare enum Actions {
    GetPolicyNameByProfileName = "getPolicyNameByProfileName",
    PreparePipelineResults = "preparePipelineResults",
    PreparePolicyResults = "preparePolicyResults",
    RemoveSandbox = "removeSandbox"
}
export type Inputs = {
    action: Actions;
    vid: string;
    vkey: string;
    appname: string;
    token: string;
    check_run_id: number;
    source_repository: string;
    fail_checks_on_policy: boolean;
    fail_checks_on_error: boolean;
    filter_mitigated_flaws: boolean;
    sandboxname: string;
    workflow_app: boolean;
};
export declare const parseInputs: (getInput: GetInput) => Inputs;
export declare const vaildateScanResultsActionInput: (inputs: Inputs) => boolean;
export declare const vaildateRemoveSandboxInput: (inputs: Inputs) => boolean;
export {};

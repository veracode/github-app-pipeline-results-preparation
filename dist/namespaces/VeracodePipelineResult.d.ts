interface File {
    source_file: {
        file: string;
        line: number;
        function_name: string;
    };
}
interface Finding {
    title: string;
    issue_id: number;
    severity: number;
    issue_type_id: string;
    issue_type: string;
    cwe_id: string;
    files: File;
}
export type ResultsData = {
    scan_id: string;
    modules: string[];
    findings: Finding[];
};
export {};

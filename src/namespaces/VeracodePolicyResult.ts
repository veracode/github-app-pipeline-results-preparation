export interface Finding {
  // Define the properties of a single finding
  issue_id: number;
  violates_policy: boolean;
  finding_status: {
    resolution: string;
    resolution_status: string;
    status: string;
  };
  finding_details: {
    severity: number;
    cwe: {
      id: number;
    };
    file_path: string;
    file_line_number: number;
  };
}

export interface ResultsData {
  page: {
    size: number;
    total_elements: number;
  };
  _embedded: {
    findings: Finding[];
  }
};

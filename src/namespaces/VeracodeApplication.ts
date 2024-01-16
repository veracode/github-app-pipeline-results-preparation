export interface Application {
  guid: string;
}

export interface ResultsData {
  page: {
    size: number;
    total_elements: number;
  };
  _embedded: {
    applications: Application[];
  };
}

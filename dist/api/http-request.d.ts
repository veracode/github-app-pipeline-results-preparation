interface Resource {
    resourceUri: string;
    queryAttribute: string;
    queryValue: string;
}
export declare function getResourceByAttribute<T>(vid: string, vkey: string, resource: Resource): Promise<T>;
export {};

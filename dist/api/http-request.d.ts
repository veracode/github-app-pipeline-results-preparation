interface Resource {
    resourceUri: string;
    queryAttribute: string;
    queryValue: string;
}
export declare function getResourceByAttribute(vid: string, vkey: string, resource: Resource): Promise<void>;
export {};

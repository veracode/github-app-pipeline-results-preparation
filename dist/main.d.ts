export declare enum Conclusion {
    Success = "success",
    Failure = "failure",
    Neutral = "neutral",
    Cancelled = "cancelled",
    TimedOut = "timed_out",
    ActionRequired = "action_required",
    Skipped = "skipped"
}
export declare enum Status {
    Queued = "queued",
    InProgress = "in_progress",
    Completed = "completed"
}
export declare function run(): Promise<void>;

import NodeCache from "node-cache";

// stdTTL: the standard time-to-live in seconds for every-cache-item.
// 0 = unlimited
// checkperiod: The period in seconds, as a number, used for the automatic delete check interval.
// 0 = no periodic check

const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

export default cache;

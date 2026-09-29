// Screens read the facility's timezone explicitly; pin the test process zone
// to something different so any accidental use of the phone zone shows up.
process.env.TZ = 'America/Los_Angeles';

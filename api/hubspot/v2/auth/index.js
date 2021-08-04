module.exports = (req, res) => {
    const authUrl =
      'https://app.hubspot.com/oauth/authorize' +
      `?client_id=` + process.env.HUBSPOT_CLIENT_ID +
      `&redirect_uri=` + (process.env.VERCEL_URL.split(":")[0] == 'localhost' ? 'http://' : 'https://') + process.env.VERCEL_URL + '/api/hubspot/v2/auth/authCallback' +
      `&scope=contacts%20timeline%20oauth`;
  
    // Redirect the user
    return res.send(`<a href=` + authUrl + `>Link Here</a>`);
  
  }
  
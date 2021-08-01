module.exports = (req, res) => {
    const { body } = req;
    res.send(body);
  };
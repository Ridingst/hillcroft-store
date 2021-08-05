module.exports = (req, res) => {
    res.send({
        branch: process.env.VERCEL_GIT_COMMIT_REF,
        sha: process.env.VERCEL_GIT_COMMIT_SHA,
        message: process.env.VERCEL_GIT_COMMIT_MESSAGE,
        author: process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN
    })
}
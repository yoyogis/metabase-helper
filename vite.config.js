module.exports = {
  proxy: {
    "/metabase": {
      target: "http://dmap.talkingdata.com/metabase",
      // target: "http://localhost:3000",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/metabase/, ""),
    },
  },
};

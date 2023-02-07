process.on('message', (msg) => {
  console.log(msg);
  const { cantidad } = msg;
  let nums = {};

  if (msg) {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    }

    for (let i = 0; i < cantidad; i++) {
      const n = getRandomInt(1000) + 1;
      nums[n] == undefined ? (nums[n] = 1) : nums[n]++;
    }
    process.send({ data: nums });
  }
});

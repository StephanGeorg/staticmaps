const workOnQueue = async (queue, index = 0) => {
  if (!queue[index]) return true; // Fininshed
  await queue[index]();
  await workOnQueue(queue, (index + 1));
};

export default workOnQueue;

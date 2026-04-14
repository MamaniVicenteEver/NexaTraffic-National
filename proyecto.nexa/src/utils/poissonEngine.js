export const generatePoisson = (lambda) => {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { 
    k++; 
    p *= Math.random(); 
  } while (p > L);
  return k - 1;
};
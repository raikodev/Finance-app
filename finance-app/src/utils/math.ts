export const calculateTrend = (current: number, previous: number): number => {
  // Если в прошлом периоде был 0, а сейчас больше, это условные +100% роста
  if (previous === 0) {
    return current > 0 ? 100 : 0; 
  }
  
  const change = ((current - previous) / Math.abs(previous)) * 100;
  
  // Округляем до одного знака после запятой (например, 12.5)
  return Number(change.toFixed(1)); 
};
/** Choose the higher-contrast foreground for the supported hex palette. */
export function nodeForeground(background: string): "#ffffff" | "#000000" {
  if (!/^#[\da-f]{6}$/i.test(background)) return "#000000";
  const channels = [1, 3, 5].map(index => parseInt(background.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const light = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return light > 0.179 ? "#000000" : "#ffffff";
}

interface OnboardData {
  name: string,
	preferCategory: string,
	educationLevel?: "beginner" | "fundamental" | "intermediate" | "expert",
	specialized: string[],
	themeColor?: "blue" | "orange" | "green" | "pink",
	persona?: "senior" | "professor" | "friend" | "assistant",
}

interface OnboardRequestData extends Omit<OnboardData, 'specialized'> {
  specialized: string;
}
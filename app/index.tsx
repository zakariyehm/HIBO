import { Redirect } from 'expo-router';

export default function Index() {
  // Always redirect to welcome screen after splash
  return <Redirect href="/welcome" />;
}


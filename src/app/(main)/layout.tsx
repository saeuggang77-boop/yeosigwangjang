import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AgeVerificationOverlay from "@/components/layout/AgeVerificationOverlay";
import OnboardingRedirect from "@/components/layout/OnboardingRedirect";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AgeVerificationOverlay />
      <OnboardingRedirect />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}

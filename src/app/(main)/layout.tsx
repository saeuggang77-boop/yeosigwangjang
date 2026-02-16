import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AgeVerificationOverlay from "@/components/layout/AgeVerificationOverlay";
import OnboardingRedirect from "@/components/layout/OnboardingRedirect";
import PopupAd from "@/components/ad/PopupAd";
import KakaoChatButton from "@/components/layout/KakaoChatButton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AgeVerificationOverlay />
      <OnboardingRedirect />
      <PopupAd />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <KakaoChatButton />
    </>
  );
}

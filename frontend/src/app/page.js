import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { Tractor, Apple } from 'lucide-react';
import Hero from './components/home/hero';
import OrganicFarmSection from './components/home/OrganicFarmSection';
import FAQ from './components/home/faq';
import AboutUsSection from './components/home/aboutus';
import FirebaseNotification from './components/FirebaseNotification';
import WhatsAppButton from './components/home/WhatsAppButton';
export default function Home() {
  return (
    <>
      <main className='bg-[#f4fff4]'>
        <Hero />
        <OrganicFarmSection />
        <AboutUsSection />
        <FAQ />
      </main> 
      <FirebaseNotification />
      <WhatsAppButton />
    </>
  );
}

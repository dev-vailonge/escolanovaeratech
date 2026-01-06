'use client';
import { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import Image from 'next/image';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '@/components/ui/modern-animated-sign-in';

type FormData = {
  email: string;
  password: string;
};

interface OrbitIcon {
  component: () => ReactNode;
  className: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
}

// Ícones de tecnologias que orbitam ao redor do logo
const iconsArray: OrbitIcon[] = [
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg'
        alt='HTML5'
        className='w-8 h-8'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 100,
    path: true,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg'
        alt='CSS3'
        className='w-8 h-8'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 100,
    path: true,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg'
        alt='TypeScript'
        className='w-10 h-10'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    path: true,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg'
        alt='JavaScript'
        className='w-10 h-10'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 210,
    duration: 20,
    delay: 20,
    path: true,
    reverse: false,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg'
        alt='TailwindCSS'
        className='w-8 h-8'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 20,
    radius: 150,
    path: true,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg'
        alt='iOS'
        className='w-8 h-8 brightness-0'
      />
    ),
    className: 'size-[30px] border-none bg-transparent',
    duration: 20,
    delay: 10,
    radius: 150,
    path: true,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg'
        alt='React'
        className='w-10 h-10'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    path: true,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg'
        alt='Kotlin'
        className='w-10 h-10'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 270,
    duration: 20,
    delay: 60,
    path: true,
    reverse: true,
  },
  {
    component: () => (
      <Image
        width={100}
        height={100}
        src='https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg'
        alt='Git'
        className='w-10 h-10'
      />
    ),
    className: 'size-[50px] border-none bg-transparent',
    radius: 320,
    duration: 20,
    delay: 20,
    path: true,
    reverse: false,
  },
];

interface AlunoLoginAnimatedProps {
  formData: FormData;
  isLoading: boolean;
  error: string;
  successMessage?: string;
  onInputChange: (event: ChangeEvent<HTMLInputElement>, name: keyof FormData) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: (event: React.MouseEvent<HTMLButtonElement>) => void;
  logo?: ReactNode;
}

export function AlunoLoginAnimated({
  formData,
  isLoading,
  error,
  successMessage,
  onInputChange,
  onSubmit,
  onForgotPassword,
  logo,
}: AlunoLoginAnimatedProps) {
  const formFields = {
    header: (
      <>
        <span className="text-yellow-400">Portal do Aluno</span>
        <br />
        <span>Seja bem-vindo</span>
      </>
    ),
    subHeader: 'Entre com suas credenciais para acessar sua conta',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'Digite seu email',
        value: formData.email,
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          onInputChange(event, 'email'),
      },
      {
        label: 'Senha',
        required: true,
        type: 'password' as const,
        placeholder: 'Digite sua senha',
        value: formData.password,
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          onInputChange(event, 'password'),
      },
    ],
    submitButton: 'Entrar',
    textVariantButton: 'Esqueceu sua senha?',
  };

  return (
    <section className='flex max-lg:justify-center h-screen bg-black overflow-hidden'>
      {/* Left Side - Animated Background */}
      <span className='flex flex-col justify-center w-1/2 max-lg:hidden relative border-r border-yellow-400/20 h-full' style={{ background: 'linear-gradient(to right, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05), transparent)' }}>
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay 
          iconsArray={iconsArray} 
          text='Escola Nova Era Tech'
        />
      </span>

      {/* Right Side - Login Form */}
      <span className='w-1/2 h-full flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] bg-black relative overflow-hidden'>
        {/* Background Gradient */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-black via-black to-yellow-600/20"></div>
        
        {/* Geometric Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 0, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 0, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md mx-auto py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28">
          <AuthTabs
            formFields={formFields}
            goTo={onForgotPassword}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            errorField={error}
            successMessage={successMessage}
            logo={logo}
          />
        </div>
      </span>
    </section>
  );
}


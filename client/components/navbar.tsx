"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Button,
  Kbd,
  Link,
  Input,
} from "@heroui/react";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useState, useEffect } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  GithubIcon,
  SearchIcon,
  HospitalLogo,
  SettingsIcon,
} from "@/components/icons";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const searchInput = (
    <Input
      aria-label="Search patients, appointments, staff..."
      classNames={{
        inputWrapper: "bg-default-100 dark:bg-default-50",
        input: "text-sm",
      }}
      endContent={
        !isMobile && (
          <Kbd className="hidden lg:inline-block" keys={["command"]}>
            K
          </Kbd>
        )
      }
      labelPlacement="outside"
      placeholder={isMobile ? "Search..." : "Search patients, appointments..."}
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
      size={isMobile ? "sm" : "md"}
    />
  );

  return (
    <HeroUINavbar 
      maxWidth="xl" 
      position="sticky" 
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-2 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <HospitalLogo className="text-primary" size={isMobile ? 24 : 32} />
            <div className="flex flex-col">
              <p className="font-bold text-inherit text-base sm:text-lg">MedCare</p>
              <p className="text-xs text-default-500 hidden sm:block">Hospital System</p>
            </div>
          </NextLink>
        </NavbarBrand>
        
        {/* Desktop Navigation */}
        <ul className="hidden lg:flex gap-4 justify-start ml-4">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium hover:text-primary transition-colors text-sm font-medium",
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {/* Desktop Search */}
        <NavbarItem className="hidden lg:flex w-full max-w-xs">
          {searchInput}
        </NavbarItem>
        
        {/* Desktop Actions */}
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal aria-label="Github" href={siteConfig.links.github}>
            <GithubIcon className="text-default-500 hover:text-primary transition-colors" size={20} />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        
        {/* Settings Button */}
        <NavbarItem className="hidden md:flex">
          <Button
            as={NextLink}
            className="text-sm font-normal text-default-600 bg-default-100 hover:bg-default-200 transition-colors"
            href="/dashboard/settings"
            startContent={<SettingsIcon className="text-default-500" size={16} />}
            variant="flat"
            size="sm"
          >
            Settings
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile Content */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal aria-label="Github" href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" size={18} />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu>
        <div className="mx-4 mt-2 mb-4">
          {searchInput}
        </div>
        <div className="mx-4 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                as={NextLink}
                color={
                  index === siteConfig.navMenuItems.length - 1
                    ? "danger"
                    : "foreground"
                }
                href={item.href}
                size="lg"
                className="w-full py-2"
                onPress={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};

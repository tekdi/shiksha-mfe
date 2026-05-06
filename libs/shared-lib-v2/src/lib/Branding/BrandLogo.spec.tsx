/// <reference types="jest" />
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  TenantBrandingProvider,
  useTenantBranding,
} from "../context/TenantBrandingContext";
import { BrandLogo } from "./BrandLogo";

describe("TenantBrandingProvider", () => {
  it("falls back to default branding when no provider is mounted", () => {
    let captured: ReturnType<typeof useTenantBranding> | undefined;
    const Probe = () => {
      captured = useTenantBranding();
      return null;
    };
    render(<Probe />);
    expect(captured?.name).toBe("Pratham");
    expect(captured?.logo).toBe("/logo.png");
  });

  it("merges partial branding with defaults", () => {
    let captured: ReturnType<typeof useTenantBranding> | undefined;
    const Probe = () => {
      captured = useTenantBranding();
      return null;
    };
    render(
      <TenantBrandingProvider branding={{ name: "Acme U" }}>
        <Probe />
      </TenantBrandingProvider>
    );
    expect(captured?.name).toBe("Acme U");
    expect(captured?.logo).toBe("/logo.png");
  });
});

describe("BrandLogo", () => {
  it("uses tenant name in alt text by default", () => {
    render(
      <TenantBrandingProvider
        branding={{ name: "Pratham", logo: "/pratham.png" }}
      >
        <BrandLogo />
      </TenantBrandingProvider>
    );
    expect(screen.getByAltText("Pratham logo")).toBeInTheDocument();
  });

  it("respects an explicit alt prop override", () => {
    render(
      <TenantBrandingProvider
        branding={{ name: "Pratham", logo: "/pratham.png" }}
      >
        <BrandLogo alt="Custom alt" />
      </TenantBrandingProvider>
    );
    expect(screen.getByAltText("Custom alt")).toBeInTheDocument();
  });

  it("hides the brand name when hideName is true", () => {
    render(
      <TenantBrandingProvider branding={{ name: "Acme U", logo: "/a.png" }}>
        <BrandLogo hideName />
      </TenantBrandingProvider>
    );
    expect(screen.queryByText("Acme U")).not.toBeInTheDocument();
  });
});

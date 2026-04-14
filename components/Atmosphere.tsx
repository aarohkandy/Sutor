interface AtmosphereProps {
  variant?: "home" | "library" | "record" | "results" | "dialog";
}

const atmosphereThemes: Record<NonNullable<AtmosphereProps["variant"]>, {
  base: string;
  primary: string;
  secondary: string;
  tertiary: string;
}> = {
  home: {
    base:
      "radial-gradient(92rem 42rem at 50% 28%, rgba(248,248,246,0.12), rgba(248,248,246,0.04) 34%, rgba(10,10,10,0) 70%), linear-gradient(180deg, rgba(17,17,17,0.84) 0%, rgba(10,10,10,0.94) 44%, rgba(10,10,10,1) 100%)",
    primary:
      "radial-gradient(58rem 32rem at 14% 22%, rgba(248,248,246,0.08), rgba(248,248,246,0.03) 42%, rgba(10,10,10,0) 74%), radial-gradient(54rem 30rem at 86% 18%, rgba(248,248,246,0.07), rgba(248,248,246,0.025) 40%, rgba(10,10,10,0) 74%)",
    secondary:
      "radial-gradient(52rem 28rem at 30% 72%, rgba(248,248,246,0.04), rgba(10,10,10,0) 72%), radial-gradient(56rem 28rem at 72% 68%, rgba(248,248,246,0.05), rgba(10,10,10,0) 74%)",
    tertiary:
      "radial-gradient(34rem 18rem at 44% 46%, rgba(248,248,246,0.025), rgba(10,10,10,0) 72%), radial-gradient(28rem 16rem at 62% 58%, rgba(248,248,246,0.018), rgba(10,10,10,0) 76%)"
  },
  library: {
    base:
      "radial-gradient(64rem 44rem at 28% 20%, rgba(248,248,246,0.11), rgba(248,248,246,0.025) 36%, rgba(10,10,10,0) 70%), linear-gradient(180deg, rgba(17,17,17,0.86) 0%, rgba(10,10,10,0.96) 52%, rgba(10,10,10,1) 100%)",
    primary:
      "radial-gradient(44rem 28rem at 14% 26%, rgba(248,248,246,0.08), rgba(248,248,246,0.025) 46%, rgba(10,10,10,0) 76%), radial-gradient(34rem 24rem at 86% 18%, rgba(248,248,246,0.045), rgba(10,10,10,0) 72%)",
    secondary:
      "radial-gradient(38rem 28rem at 36% 78%, rgba(248,248,246,0.05), rgba(10,10,10,0) 72%), radial-gradient(44rem 30rem at 82% 64%, rgba(248,248,246,0.03), rgba(10,10,10,0) 74%)",
    tertiary:
      "linear-gradient(180deg, rgba(248,248,246,0.015) 0%, rgba(248,248,246,0) 32%, rgba(248,248,246,0.02) 100%)"
  },
  record: {
    base:
      "radial-gradient(66rem 44rem at 50% 18%, rgba(248,248,246,0.09), rgba(248,248,246,0.02) 34%, rgba(10,10,10,0) 70%), linear-gradient(180deg, rgba(17,17,17,0.82) 0%, rgba(10,10,10,0.95) 42%, rgba(10,10,10,1) 100%)",
    primary:
      "radial-gradient(40rem 26rem at 22% 16%, rgba(248,248,246,0.05), rgba(10,10,10,0) 72%), radial-gradient(40rem 28rem at 78% 18%, rgba(248,248,246,0.05), rgba(10,10,10,0) 74%)",
    secondary:
      "radial-gradient(46rem 30rem at 50% 74%, rgba(248,248,246,0.05), rgba(10,10,10,0) 74%), radial-gradient(34rem 24rem at 12% 62%, rgba(248,248,246,0.025), rgba(10,10,10,0) 74%)",
    tertiary:
      "linear-gradient(180deg, rgba(248,248,246,0.02) 0%, rgba(248,248,246,0) 26%, rgba(248,248,246,0.02) 100%)"
  },
  results: {
    base:
      "radial-gradient(60rem 42rem at 50% 20%, rgba(248,248,246,0.11), rgba(248,248,246,0.03) 38%, rgba(10,10,10,0) 72%), linear-gradient(180deg, rgba(17,17,17,0.84) 0%, rgba(10,10,10,0.95) 46%, rgba(10,10,10,1) 100%)",
    primary:
      "radial-gradient(42rem 28rem at 24% 18%, rgba(248,248,246,0.06), rgba(10,10,10,0) 74%), radial-gradient(42rem 30rem at 76% 22%, rgba(248,248,246,0.06), rgba(10,10,10,0) 72%)",
    secondary:
      "radial-gradient(48rem 32rem at 50% 72%, rgba(248,248,246,0.05), rgba(10,10,10,0) 76%), radial-gradient(28rem 22rem at 86% 70%, rgba(248,248,246,0.02), rgba(10,10,10,0) 76%)",
    tertiary:
      "linear-gradient(180deg, rgba(248,248,246,0.014) 0%, rgba(248,248,246,0) 30%, rgba(248,248,246,0.022) 100%)"
  },
  dialog: {
    base:
      "radial-gradient(44rem 30rem at 50% 26%, rgba(248,248,246,0.08), rgba(248,248,246,0.02) 38%, rgba(10,10,10,0) 74%), linear-gradient(180deg, rgba(10,10,10,0.84) 0%, rgba(10,10,10,0.92) 100%)",
    primary:
      "radial-gradient(34rem 24rem at 24% 20%, rgba(248,248,246,0.05), rgba(10,10,10,0) 74%), radial-gradient(34rem 24rem at 76% 24%, rgba(248,248,246,0.045), rgba(10,10,10,0) 76%)",
    secondary:
      "radial-gradient(36rem 24rem at 50% 76%, rgba(248,248,246,0.035), rgba(10,10,10,0) 78%)",
    tertiary:
      "linear-gradient(180deg, rgba(248,248,246,0.015) 0%, rgba(248,248,246,0) 100%)"
  }
};

export function Atmosphere({ variant = "home" }: AtmosphereProps) {
  const theme = atmosphereThemes[variant];

  return (
    <div aria-hidden="true" className="page-atmosphere">
      <div className="page-atmosphere__base" style={{ backgroundImage: theme.base }} />
      <div className="page-atmosphere__fog page-atmosphere__fog--primary" style={{ backgroundImage: theme.primary }} />
      <div className="page-atmosphere__fog page-atmosphere__fog--secondary" style={{ backgroundImage: theme.secondary }} />
      <div className="page-atmosphere__fog page-atmosphere__fog--tertiary" style={{ backgroundImage: theme.tertiary }} />
      <div className="page-atmosphere__grain" />
    </div>
  );
}

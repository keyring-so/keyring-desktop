export const LogoImageSrc = "build/appicon.png"

const Logo = () => {
  return (
    <div className="w-3/4">
      <img className="ml-0.5" src={LogoImageSrc} alt="keyring logo" />
    </div>
  );
};

export default Logo;

import { Svg, Path, G, Defs, ClipPath, Use, SvgProps } from "react-native-svg"
import { cssInterop } from "nativewind"

cssInterop(Svg, {
  className: {
    target: "style",
    nativeStyleToProp: { width: true, height: true },
  },
})
cssInterop(Path, {
  target: "fill",
})

export type IconProps = SvgProps & { className: string; fill?: string }

{
  /* General Icons */
}
export const LeftArrow = ({ className, fill = "#000000", ...rest }: IconProps) => (
  <Svg viewBox="0 0 10 19" fill="none" className={className} {...rest}>
    <Path
      d="M8.01533 18.0821C7.67933 18.0821 7.34333 17.9416 7.084 17.6594L0.402 10.3867C0.145 10.1071 0 9.72306 0 9.32226C0 8.92147 0.145 8.53778 0.402 8.25782L7.071 0.999636C7.59833 0.426328 8.442 0.437482 8.95667 1.02529C9.47067 1.6131 9.46067 2.55485 8.93367 3.12816L3.24233 9.32226L8.94667 15.5305C9.47367 16.1038 9.48367 17.0456 8.96967 17.6334C8.70867 17.9319 8.362 18.0821 8.01533 18.0821Z"
      fill={fill}
    />
  </Svg>
)

{
  /* Social Icons */
}
export const GoogleIcon = ({ className, fill = "#000000", ...rest }: IconProps) => (
  <Svg viewBox="0 0 32 32" className={className} {...rest}>
    <Defs>
      <Path
        id="A"
        d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
      />
    </Defs>
    <ClipPath id="B">
      <Use href="#A" />
    </ClipPath>
    <G transform="matrix(.727273 0 0 .727273 -.954545 -1.45455)">
      <Path d="M0 37V11l17 13z" clipPath="url(#B)" fill="#fbbc05" />
      <Path d="M0 11l17 13 7-6.1L48 14V0H0z" clipPath="url(#B)" fill="#ea4335" />
      <Path d="M0 37l30-23 7.9 1L48 0v48H0z" clipPath="url(#B)" fill="#34a853" />
      <Path d="M48 48L17 24l-4-3 35-10z" clipPath="url(#B)" fill="#4285f4" />
    </G>
  </Svg>
)
export const LinkedInIcon = ({ className, fill = "#000000", ...rest }: IconProps) => (
  <Svg viewBox="0 0 72 72" className={className} {...rest}>
    <G fill="none" fillRule="evenodd">
      <Path
        d="M8,72 L64,72 C68.418278,72 72,68.418278 72,64 L72,8 C72,3.581722 68.418278,-8.11624501e-16 64,0 L8,0 C3.581722,8.11624501e-16 -5.41083001e-16,3.581722 0,8 L0,64 C5.41083001e-16,68.418278 3.581722,72 8,72 Z"
        fill="#007EBB"
      />
      <Path
        d="M62,62 L51.315625,62 L51.315625,43.8021149 C51.315625,38.8127542 49.4197917,36.0245323 45.4707031,36.0245323 C41.1746094,36.0245323 38.9300781,38.9261103 38.9300781,43.8021149 L38.9300781,62 L28.6333333,62 L28.6333333,27.3333333 L38.9300781,27.3333333 L38.9300781,32.0029283 C38.9300781,32.0029283 42.0260417,26.2742151 49.3825521,26.2742151 C56.7356771,26.2742151 62,30.7644705 62,40.051212 L62,62 Z M16.349349,22.7940133 C12.8420573,22.7940133 10,19.9296567 10,16.3970067 C10,12.8643566 12.8420573,10 16.349349,10 C19.8566406,10 22.6970052,12.8643566 22.6970052,16.3970067 C22.6970052,19.9296567 19.8566406,22.7940133 16.349349,22.7940133 Z M11.0325521,62 L21.769401,62 L21.769401,27.3333333 L11.0325521,27.3333333 L11.0325521,62 Z"
        fill="#FFF"
      />
    </G>
  </Svg>
)

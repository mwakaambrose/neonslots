import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <div>
            <img src="/images/slot.png" alt="App Logo" width="40" height="42" {...props} />
        </div>
    );
}

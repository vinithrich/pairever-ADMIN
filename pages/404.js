// import node module libraries
import { Fragment } from "react";
import { Col, Row, Image } from "react-bootstrap";
import Link from "next/link";
// import blank layout, header and footer to override default layout
import NotFound from "@/layouts/NotFound";

const Error404 = () => {
    return (
        <Fragment>
            <div className='error-page'>
                <h1>404</h1>

                <div className='cloak'>
                    <div className='cloak__wrapper'>
                        <div className='cloak__container'></div>
                    </div>
                </div>
                <div className='info'>
                    <h2 className="text-white">Oops! This Page Got Lost in the Digital World.</h2>
                    <p className='error-sub-head mt-4'>It seems the page you're looking for has taken a wrong turn or simply doesn't exist anymore. But don’t worry, we’re here to help you get back on track!</p>


                    <div className='error-route'>
                        {/* <Link href='/dashboard'><p> Return to the <span className='error-route-key'>Dashboard</span> and start fresh.</p></Link> */}
                        {/* <a href="/web3-marketing-services" target="_blank" rel="noreferrer noopener"><p><LazyLoadImage src={tick} alt='tick' className='error-page-img' />Explore our <span className='error-route-key'> Services</span> to see what we offer.</p></a>

                    <a href="/contact-us" target="_blank" rel="noreferrer noopener"><p><LazyLoadImage src={tick} alt='tick' className='error-page-img' /><span className='error-route-key'> Contact</span> Us if you need any assistance.</p></a> */}
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

Error404.Layout = NotFound;

export default Error404;

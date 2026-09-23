// import node module libraries
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMediaQuery } from 'react-responsive';

// import sub components
import NavbarVertical from './navbars/NavbarVertical';
import NavbarTop from './navbars/NavbarTop';
import { Row, Col } from 'react-bootstrap';

const DefaultDashboardLayout = (props) => {
	const router = useRouter();
	const isMobile = useMediaQuery({ maxWidth: 767 });

	// The `toggled` class means opposite things either side of 768px (see
	// _layout.scss): on desktop it HIDES the sidebar, on mobile it SHOWS it. So the
	// closed state is showMenu=true on desktop and showMenu=false on mobile.
	const [showMenu, setShowMenu] = useState(true);
	const sidebarOpen = isMobile ? !showMenu : showMenu;

	const ToggleMenu = () => {
		return setShowMenu(!showMenu);
	};

	// Start closed on a phone, where an open sidebar covers the whole screen.
	useEffect(() => {
		setShowMenu(!isMobile);
	}, [isMobile]);

	// Close it after navigating, or the menu stays over the page just opened.
	useEffect(() => {
		const closeOnMobile = () => {
			if (isMobile) setShowMenu(true);
		};
		router.events.on('routeChangeComplete', closeOnMobile);
		return () => router.events.off('routeChangeComplete', closeOnMobile);
	}, [router.events, isMobile]);

	return (
		<div id="db-wrapper" className={`${showMenu ? '' : 'toggled'}`}>
			{/* Tapping outside closes the menu — expected on mobile, and without it the
			    only way out is the hamburger, which the open sidebar covers. */}
			{isMobile && sidebarOpen && (
				<div
					className="sidebar-backdrop"
					onClick={() => setShowMenu(true)}
					aria-hidden="true"
				/>
			)}
			<div className="navbar-vertical navbar" >
				<NavbarVertical
					showMenu={showMenu}
					onClick={(value) => setShowMenu(value)}
				/>
			</div>
			<div id="page-content">
				<div className="header" style={{ zIndex: 1000, position: 'relative' }}>
					<NavbarTop
						data={{
							showMenu: showMenu,
							SidebarToggleMenu: ToggleMenu
						}}
					/>
				</div>

				{props.children}
				<div className='p-3'>
				<h5 className='text-white text-center fw-bold'>Copyright © 2026 PairEver app. All rights reserved</h5>
				</div>
				{/* <div className='px-6 border-top py-3'>
					<Row>
						<Col sm={6} className='text-center text-sm-start mb-2 mb-sm-0'>
							<p className='m-0'>Made by <a href='https://codescandy.com/' target='_blank'>Codescandy</a></p></Col>
						<Col sm={6} className='text-center text-sm-end'>
							<p className='m-0'>Destributed by <a href='https://themewagon.com/' target='_blank'>ThemeWagon</a></p>
						</Col>
					</Row>
				</div> */}
			</div>
			{/* <div className='bg-black'>

			</div> */}
		</div>
	);
};
export default DefaultDashboardLayout;

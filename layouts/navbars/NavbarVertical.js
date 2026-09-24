// import node module libraries
import { Fragment, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMediaQuery } from "react-responsive";
import {
  ListGroup,
  Accordion,
  Card,
  Image,
  Badge,
  Form,
  InputGroup,
  Button,
  useAccordionButton,
  AccordionContext,
} from "react-bootstrap";

// import simple bar scrolling used for notification item scrolling
import SimpleBar from "simplebar-react";
import 'simplebar-react/dist/simplebar.min.css';

// import routes file
import { DashboardMenu } from "@/routes/DashboardRoutes";
import { canAccessKey } from "@/helper/accessControl";
import { useAuth } from "@/helper/Context/AuthContext";
import { appLabel, readSelectedApp } from "@/helper/appName";

const NavbarVertical = (props) => {
  const location = useRouter();
  const { user } = useAuth();
  const [selectedApp, setSelectedApp] = useState("0");
  const [menuSearch, setMenuSearch] = useState("");
  const appTitle = appLabel(selectedApp);

  // Switch App writes to localStorage and router.push()es, so this re-reads on every
  // navigation as well as on a change made in another tab.
  useEffect(() => {
    const sync = () => {
      const next = readSelectedApp();
      setSelectedApp((prev) => (prev === next ? prev : next));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [location.asPath]);

  const filterMenuByAccess = (items = []) =>
    items
      .map((item) => {
        if (item.children) {
          const children = filterMenuByAccess(item.children);

          if (!children.length) {
            return null;
          }

          return {
            ...item,
            children,
          };
        }

        // An item may also be limited to certain apps; one with no `apps` list
        // shows everywhere, so existing entries are unaffected.
        if (Array.isArray(item.apps) && !item.apps.includes(selectedApp)) {
          return null;
        }

        return canAccessKey(user, item.accessKey) ? item : null;
      })
      .filter(Boolean);

  const accessibleMenu = filterMenuByAccess(DashboardMenu).map((item) => {
    if (item.title === "Pair Ever") {
      return { ...item, title: appTitle };
    }
    return item;
  });

  // Search runs over the menu the admin is ALREADY allowed to see, so it can never
  // surface a page they have no permission for.
  const searchTerm = menuSearch.trim().toLowerCase();

  const filterMenuBySearch = (items = []) =>
    items
      .map((item) => {
        // Group headings have no link of their own; keep one only if something
        // under it survives, which the pass below handles.
        if (item.grouptitle) return item;

        if (item.children) {
          const children = filterMenuBySearch(item.children);
          if (!children.length) return null;
          return { ...item, children };
        }

        const haystack = `${item.title || ""} ${item.name || ""}`.toLowerCase();
        return haystack.includes(searchTerm) ? item : null;
      })
      .filter(Boolean)
      // Drop a heading that ended up with nothing beneath it.
      .filter((item, index, list) => {
        if (!item.grouptitle) return true;
        const next = list[index + 1];
        return Boolean(next) && !next.grouptitle;
      });

  const allowedMenu = searchTerm ? filterMenuBySearch(accessibleMenu) : accessibleMenu;

  const CustomToggle = ({ children, eventKey, icon }) => {
    const { activeEventKey } = useContext(AccordionContext);
    const decoratedOnClick = useAccordionButton(eventKey, () =>
      console.log("totally custom!")
    );
    const isCurrentEventKey = activeEventKey === eventKey;
    return (
      <li className="nav-item">
        <Link
          href=""
          className="nav-link "
          onClick={decoratedOnClick}
          data-bs-toggle="collapse"
          data-bs-target="#navDashboard"
          aria-expanded={isCurrentEventKey ? true : false}
          aria-controls="navDashboard"
        >
          {typeof icon === "string" ? (
            <i className={`nav-icon fe fe-${icon} me-2`}></i>
          ) : (
            <span className="nav-icon me-2">{icon}</span>
          )}
          {children}
        </Link>
      </li>
    );
  };
  const CustomToggleLevel2 = ({ children, eventKey, icon }) => {
    const { activeEventKey } = useContext(AccordionContext);
    const decoratedOnClick = useAccordionButton(eventKey, () =>
      console.log("totally custom!")
    );
    const isCurrentEventKey = activeEventKey === eventKey;
    return (
      <Link
        href=""
        className="nav-link "
        onClick={decoratedOnClick}
        data-bs-toggle="collapse"
        data-bs-target="#navDashboard"
        aria-expanded={isCurrentEventKey ? true : false}
        aria-controls="navDashboard"
      >
        {children}
      </Link>
    );
  };

  const generateLink = (item) => {
    return (
      <Link
        href={item.link}
        className={`nav-link ${location.pathname === item.link || location.pathname.includes(item.link) ? "active" : ""
          }`}
        onClick={(e) =>
          isMobile ? props.onClick(!props.showMenu) : props.showMenu
        }
      >
        {item.name}
        {""}
        {item.badge ? (
          <Badge
            className="ms-1"
            bg={item.badgecolor ? item.badgecolor : "primary"}
          >
            {item.badge}
          </Badge>
        ) : (
          ""
        )}
      </Link>
    );
  };

  const isMobile = useMediaQuery({ maxWidth: 767 });

  return (
    <Fragment>
      <SimpleBar className="navbar-vertical-scroll">
        <div className="px-4 pt-4 pb-2">
          <InputGroup size="sm">
            <InputGroup.Text className="bg-transparent border-end-0">
              <i className="fe fe-search" />
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder="Search menu..."
              aria-label="Search menu"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="border-start-0"
            />
            {menuSearch && (
              <Button
                variant="outline-secondary"
                onClick={() => setMenuSearch("")}
                aria-label="Clear menu search"
              >
                ×
              </Button>
            )}
          </InputGroup>
        </div>

        {searchTerm && allowedMenu.length === 0 && (
          <div className="px-4 py-3 text-muted small">
            No menu items match &quot;{menuSearch}&quot;
          </div>
        )}

        <div className="nav-scroller">
          {/* <Link href="/" className="navbar-brand">
            <Image src="/images/brand/logo/logo.svg" alt="" />
          </Link> */}
        </div>
        {/* Dashboard Menu */}
        <Accordion
          // While searching, open every group so matches nested inside a collapsed
          // section are actually visible instead of silently hidden.
          {...(searchTerm ? { alwaysOpen: true, activeKey: allowedMenu.map((_, i) => i) } : { defaultActiveKey: "0" })}
          as="ul"
          className="navbar-nav flex-column"
        >
          {allowedMenu?.map(function (menu, index) {
            if (menu.grouptitle) {
              return (
                <Card bsPrefix="nav-item" key={index}>
                  {/* group title item */}
                  <div className="navbar-heading">{menu.title}</div>
                  {/* end of group title item */}
                </Card>
              );
            } else {
              if (menu.children) {
                return (
                  <Fragment key={index}>
                    {/* main menu / root menu level / root items */}
                    <CustomToggle eventKey={index} icon={menu.icon}>
                      {menu.title}
                      {menu.badge ? (
                        <Badge
                          className="ms-1"
                          bg={menu.badgecolor ? menu.badgecolor : "primary"}
                        >
                          {menu.badge}
                        </Badge>
                      ) : (
                        ""
                      )}
                    </CustomToggle>
                    <Accordion.Collapse
                      eventKey={index}
                      as="li"
                      bsPrefix="nav-item"
                    >
                      <ListGroup
                        as="ul"
                        bsPrefix=""
                        className="nav flex-column"
                      >
                        {menu.children.map(function (
                          menuLevel1Item,
                          menuLevel1Index
                        ) {
                          if (menuLevel1Item.children) {
                            return (
                              <div className="vertical-overflow">
                              <ListGroup.Item
                                as="li"
                                bsPrefix="nav-item"
                                key={menuLevel1Index}
                              >
                                {/* first level menu started  */}
                                <Accordion
                                  defaultActiveKey="0"
                                  className="navbar-nav flex-column"
                                >
                                  <CustomToggleLevel2 eventKey={0}>
                                    {menuLevel1Item.title}
                                    {menuLevel1Item.badge ? (
                                      <Badge
                                        className="ms-1"
                                        bg={
                                          menuLevel1Item.badgecolor
                                            ? menuLevel1Item.badgecolor
                                            : "primary"
                                        }
                                      >
                                        {menuLevel1Item.badge}
                                      </Badge>
                                    ) : (
                                      ""
                                    )}
                                  </CustomToggleLevel2>
                                  <Accordion.Collapse
                                    eventKey={0}
                                    bsPrefix="nav-item"
                                  >
                                    <ListGroup
                                      as="ul"
                                      bsPrefix=""
                                      className="nav flex-column"
                                    >
                                      {/* second level menu started  */}
                                      {menuLevel1Item.children.map(function (
                                        menuLevel2Item,
                                        menuLevel2Index
                                      ) {
                                        if (menuLevel2Item.children) {
                                          return (
                                            <ListGroup.Item
                                              as="li"
                                              bsPrefix="nav-item"
                                              key={menuLevel2Index}
                                            >
                                              {/* second level accordion menu started  */}
                                              <Accordion
                                                defaultActiveKey="0"
                                                className="navbar-nav flex-column"
                                              >
                                                <CustomToggleLevel2
                                                  eventKey={0}
                                                >
                                                  {menuLevel2Item.title}
                                                  {menuLevel2Item.badge ? (
                                                    <Badge
                                                      className="ms-1"
                                                      bg={
                                                        menuLevel2Item.badgecolor
                                                          ? menuLevel2Item.badgecolor
                                                          : "primary"
                                                      }
                                                    >
                                                      {menuLevel2Item.badge}
                                                    </Badge>
                                                  ) : (
                                                    ""
                                                  )}
                                                </CustomToggleLevel2>
                                                <Accordion.Collapse
                                                  eventKey={0}
                                                  bsPrefix="nav-item"
                                                >
                                                  <ListGroup
                                                    as="ul"
                                                    bsPrefix=""
                                                    className="nav flex-column"
                                                  >
                                                    {/* third level menu started  */}
                                                    {menuLevel2Item.children.map(
                                                      function (
                                                        menuLevel3Item,
                                                        menuLevel3Index
                                                      ) {
                                                        return (
                                                          <ListGroup.Item
                                                            key={
                                                              menuLevel3Index
                                                            }
                                                            as="li"
                                                            bsPrefix="nav-item"
                                                          >
                                                            {generateLink(
                                                              menuLevel3Item
                                                            )}
                                                          </ListGroup.Item>
                                                        );
                                                      }
                                                    )}
                                                    {/* end of third level menu  */}
                                                  </ListGroup>
                                                </Accordion.Collapse>
                                              </Accordion>
                                              {/* end of second level accordion */}
                                            </ListGroup.Item>
                                          );
                                        } else {
                                          return (
                                            <ListGroup.Item
                                              key={menuLevel2Index}
                                              as="li"
                                              bsPrefix="nav-item"
                                            >
                                              {generateLink(menuLevel2Item)}
                                            </ListGroup.Item>
                                          );
                                        }
                                      })}
                                      {/* end of second level menu  */}
                                    </ListGroup>
                                  </Accordion.Collapse>
                                </Accordion>
                                {/* end of first level menu */}
                              </ListGroup.Item>
                              </div>
                            );
                          } else {
                            return (
                              <ListGroup.Item
                                as="li"
                                bsPrefix="nav-item"
                                key={menuLevel1Index}
                              >
                                {/* first level menu items */}
                                {generateLink(menuLevel1Item)}
                                {/* end of first level menu items */}
                              </ListGroup.Item>
                            );
                          }
                        })}
                      </ListGroup>
                    </Accordion.Collapse>
                    {/* end of main menu / menu level 1 / root items */}
                  </Fragment>
                );
              } else {
                return (
                  <Card bsPrefix="nav-item" key={index}>
                    {/* menu item without any childern items like Documentation and Changelog items*/}
                    <Link
                      href={menu.link}
                      className={`nav-link ${location.pathname === menu.link ? "active" : ""
                        }`}
                    >
                      {typeof menu.icon === "string" ? (
                        <i className={`nav-icon fe fe-${menu.icon} me-2`}></i>
                      ) : (
                        menu.icon
                      )}
                      {menu.title}
                      {menu.badge ? (
                        <Badge
                          className="ms-1"
                          bg={menu.badgecolor ? menu.badgecolor : "primary"}
                        >
                          {menu.badge}
                        </Badge>
                      ) : (
                        ""
                      )}
                    </Link>
                    {/* end of menu item without any childern items */}
                  </Card>
                );
              }
            }
          })}
        </Accordion>
        {/* end of Dashboard Menu */}
      </SimpleBar>
    </Fragment>
  );
};

export default NavbarVertical;

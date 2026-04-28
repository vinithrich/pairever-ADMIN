/**
 * The folder sub-components contains sub component of all the pages,
 * so here you will find folder names which are listed in root pages.
 */

// sub components for /pages/dashboard
import ActiveProjects from '@/sub-components/dashboard/ActiveProjects';
// import TasksPerformance from '@/sub-components/dashboard/TasksPerformance';
import Teams from '@/sub-components/dashboard/Teams';

// sub components for /pages/profile
import SubAdminCredentials from '@/sub-components/profile/SubAdminCredentials';
import ActivityFeed from '@/sub-components/profile/ActivityFeed';
import MyTeam from '@/sub-components/profile/MyTeam';
import ProfileHeader from '@/sub-components/profile/ProfileHeader';
import SubAdminPermissionLists from '@/sub-components/profile/SubAdminPermissionLists';
import RecentFromBlog from '@/sub-components/profile/RecentFromBlog';

// sub components for /pages/billing
import CurrentPlan from '@/sub-components/billing/CurrentPlan';
import BillingAddress from '@/sub-components/billing/BillingAddress';

// sub components for /pages/settings
import DeleteAccount from '@/sub-components/settings/DeleteAccount';
import EmailSetting from '@/sub-components/settings/EmailSetting';
import GeneralSetting from '@/sub-components/settings/GeneralSetting';
import Notifications from '@/sub-components/settings/Notifications';
import Preferences from '@/sub-components/settings/Preferences';


export {
   ActiveProjects,
   // TasksPerformance,
   Teams,

   SubAdminCredentials,
   ActivityFeed,
   MyTeam,
   ProfileHeader,
   SubAdminPermissionLists,
   RecentFromBlog,

   CurrentPlan,
   BillingAddress,

   DeleteAccount,
   EmailSetting,
   GeneralSetting,
   Notifications,
   Preferences
};

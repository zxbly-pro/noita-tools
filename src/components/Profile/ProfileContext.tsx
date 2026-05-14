import { createContext, Suspense } from "react";

export type IPatreonData = {
  patreonId: string;
  noitoolId: string;
  userName: string;
  url: string;
  avatar: string;
  activePatron: boolean;

  resetDay: number;
  computeLeft: number;
  patreonComputeLeft: number;
  providedComputeLeft: number;
};

interface IProfileContext {
  patreonData: IPatreonData | null;
  patreonDataLoading: boolean;
  patreonDataError: boolean;
  handleLogout: () => void;
  handleLogoutAll: () => void;
}

const ProfileContext = createContext<IProfileContext>({
  patreonData: null,
  patreonDataLoading: false,
  patreonDataError: false,
  handleLogout: () => {},
  handleLogoutAll: () => {},
});

const ProfileProvider = props => {
  return (
    <ProfileContext.Provider
      value={{
        patreonData: null,
        patreonDataLoading: false,
        patreonDataError: false,
        handleLogout: () => {},
        handleLogoutAll: () => {},
      }}
    >
      <Suspense fallback={<></>}>{props.children}</Suspense>
    </ProfileContext.Provider>
  );
};

export { ProfileContext, ProfileProvider };

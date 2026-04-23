/* eslint-disable @nx/enforce-module-boundaries */
import KaTableComponent from '@workspace/components/KaTableComponent';
import Loader from '@workspace/components/Loader';
import PaginationComponent from '@workspace/components/PaginationComponent';
import WorkspaceText from '@workspace/components/WorkspaceText';
import { timeAgo } from '@workspace/utils/Helper';
import { LIMIT } from '@workspace/utils/app.constant';
import useSharedStore from '@workspace/utils/useSharedState';
import { Box, Typography, useTheme } from '@mui/material';
import { DataType } from 'ka-table/enums';
import 'ka-table/style.css';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../../../components/Layout';
import SearchBox from '../../../../components/SearchBox';
import { getContent } from '../../../../services/ContentService';
import useTenantConfig from '@workspace/hooks/useTenantConfig';
import WorkspaceHeader from '@workspace/components/WorkspaceHeader';
// const columns = [
//   { key: 'name', title: 'Content', dataType: DataType.String, width: "450px" },
//   { key: 'lastUpdatedOn', title: 'Last Updated', dataType: DataType.String, width: "300px" },
//   { key: 'status', title: 'Status', dataType: DataType.String, width: "300px" },
//   { key: 'contentAction', title: 'Action', dataType: DataType.String, width: "200px" },

// ]
const columns = [
  {
    key: 'title_and_description',
    title: 'TITLE & DESCRIPTION',
    dataType: DataType.String,
    width: '350px',
  },
  {
    key: 'create-by',
    title: 'CREATED BY',
    dataType: DataType.String,
    width: '100px',
  },

  {
    key: 'contentType',
    title: 'CONTENT TYPE',
    dataType: DataType.String,
    width: '100px',
  },
  { key: 'state', title: 'STATE', dataType: DataType.String, width: '100px' },

  { key: 'status', title: 'STATUS', dataType: DataType.String, width: '100px' },
  {
    key: 'lastUpdatedOn',
    title: 'LAST MODIFIED',
    dataType: DataType.String,
    width: '100px',
  },
];
const ContentsPage = () => {
  const { tenantConfig, isLoading, error } = useTenantConfig();
  const theme = useTheme<any>();
  const router = useRouter();
  const [showHeader, setShowHeader] = useState<boolean | null>(null);
  const [selectedKey, setSelectedKey] = useState('discover-contents');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const filterOption: string[] = router.query.filterOptions
    ? JSON.parse(router.query.filterOptions as string)
    : [];
  const [filter, setFilter] = useState<string[]>(filterOption);
  const sort: string =
    typeof router.query.sort === 'string' ? router.query.sort : 'Modified On';
  const [sortBy, setSortBy] = useState(sort);
  interface content {
  appIcon?: string;
  appicon?: string;
  posterImage?: string;
  primaryCategory?: string;
  name: string;
  lastUpdatedOn?: string;
  status?: string;
  identifier?: string;
  mimeType?: string;
  mode?: string;
  creator?: string;
  description?: string;
  state?: string;
  author?: string;
  access?: string;
  url?: string;
  resource?: string;
}

  const [contentList, setContentList] = React.useState<content[]>([]);
  const [data, setData] = React.useState<any[]>([]);
  const prevFilterRef = useRef(filter);

  const [loading, setLoading] = useState(false);
  const [contentDeleted, setContentDeleted] = React.useState(false);
  const fetchContentAPI = useSharedStore((state: any) => state.fetchContentAPI);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(searchTerm);
  const [totalCount, setTotalCount] = useState(0);
  const stateQuery: string =
    typeof router.query.state === 'string' ? router.query.state : 'All';
  const [state, setState] = useState<string>(stateQuery);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage - 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  useEffect(() => {
    const headerValue = localStorage.getItem('showHeader');
    setShowHeader(headerValue === 'true');
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter: string[]) => {
    setFilter(filter);
  };

  const handleSortChange = (sortBy: string) => {
    console.log('sortBy', sortBy);
    setSortBy(sortBy);
  };
  const handleStateChange = (state: string) => {
    setState(state);
  };

  useEffect(() => {
    const getContentList = async () => {
      try {
        if (!tenantConfig) return;
        setLoading(true);
        const status = [
          // "Draft",
          // "FlagDraft",
          // "Review",
          // "Processing",
          'Live',
          // "Unlisted",
          // "FlagReview",
        ];
        const query = debouncedSearchTerm || '';

        const primaryCategory = filter.length ? filter : [];
        const order = sortBy === 'Created On' ? 'asc' : 'desc';
        const sort_by = {
          lastUpdatedOn: order,
        };
        let offset = debouncedSearchTerm !== '' ? 0 : page * LIMIT;
        if (prevFilterRef.current !== filter) {
          offset = 0;
          setPage(0);

          prevFilterRef.current = filter;
        }
        const contentType = 'discover-contents';

        const response = await getContent(
          status,
          query,
          LIMIT,
          offset,
          primaryCategory,
          sort_by,
          tenantConfig?.CHANNEL_ID,
          contentType,
          state !== 'All' ? state : undefined
        );

        const contentList = (response?.content || []).concat(
          response?.QuestionSet || []
        );
        setContentList(contentList);
        setTotalCount(response?.count);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    getContentList();
  }, [
    tenantConfig,
    debouncedSearchTerm,
    filter,
    fetchContentAPI,
    sortBy,
    state,
    page,
  ]);

  useEffect(() => {
    console.log('contentList 193', contentList);
    const filteredArray = contentList.map((item) => ({
      image: item?.appIcon || item?.posterImage || item?.appicon,
      contentType: item.primaryCategory,
      name: item.name,
      primaryCategory: item.primaryCategory,
      lastUpdatedOn: timeAgo(item.lastUpdatedOn || ""),
      status: item.status,
      identifier: item.identifier,
      mimeType: item.mimeType,
      mode: item.mode,
      creator: item.creator,
      description: item?.description,
      state: item?.state,
      author: item.author,
      access: item.access,
      url: item.url,
      posterImage: item.posterImage,
      appicon: item.appicon,
      resource: item.resource,
    }));
    setData(filteredArray);
    console.log(filteredArray);
  }, [contentList]);

  const filteredData = useMemo(
    () =>
      contentList?.filter((content) =>
        content?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ),
    [debouncedSearchTerm, contentList]
  );

  const displayedRows = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  console.log('data 227', data);
  return (
    <>
      {showHeader && <WorkspaceHeader />}
      <Layout selectedKey={selectedKey} onSelect={setSelectedKey}>
        <WorkspaceText />

        <Box p={3}>
          <Box
            sx={{
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0px 2px 6px 2px #00000026',
              pb: totalCount > LIMIT ? '15px' : '0px',
            }}
          >
            <Box p={2}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 'bold', fontSize: '16px' }}
              >
                Discover Contents
              </Typography>
            </Box>
            {/* <Typography mb={2}>Here you see all your content.</Typography> */}

            <Box mb={3}>
              <SearchBox
                placeholder="Search by title..."
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onStateChange={handleStateChange}
                discoverContents={true}
              />
            </Box>
            {loading ? (
              <Loader showBackdrop={true} loadingText={'Loading'} />
            ) : (
              <>
                <Box className="table-ka-container">
                  <KaTableComponent
                    columns={columns}
                    tableTitle="discover-contents"
                    data={data}
                  />
                </Box>
              </>
            )}
            {totalCount > LIMIT && (
              <PaginationComponent
                count={Math.ceil(totalCount / LIMIT)}
                page={page}
                setPage={setPage}
                onPageChange={(event, newPage) => setPage(newPage - 1)}
              />
            )}
          </Box>
        </Box>
      </Layout>
    </>
  );
};

export default ContentsPage;

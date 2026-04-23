/* eslint-disable @nx/enforce-module-boundaries */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../../../../components/Layout';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getContent } from '@workspace/services/ContentService';
import SearchBox from '../../../../components/SearchBox';
import PaginationComponent from '@workspace/components/PaginationComponent';
import NoDataFound from '@workspace/components/NoDataFound';
import { LIMIT } from '@workspace/utils/app.constant';
import { useRouter } from 'next/router';
import { MIME_TYPE } from '@workspace/utils/app.config';
import WorkspaceText from '@workspace/components/WorkspaceText';
import { DataType } from 'ka-table/enums';
import KaTableComponent from '@workspace/components/KaTableComponent';
import { timeAgo } from '@workspace/utils/Helper';
import useSharedStore from '@workspace/utils/useSharedState';
import useTenantConfig from '@workspace/hooks/useTenantConfig';
import WorkspaceHeader from '@workspace/components/WorkspaceHeader';
const columns = [
  {
    key: 'title_and_description',
    title: 'TITLE & DESCRIPTION',
    dataType: DataType.String,
    width: '450px',
  },
  {
    key: 'contentType',
    title: 'CONTENT TYPE',
    dataType: DataType.String,
    width: '200px',
  },
  // { key: 'status', title: 'STATUS', dataType: DataType.String, width: "100px" },
  {
    key: 'lastUpdatedOn',
    title: 'LAST MODIFIED',
    dataType: DataType.String,
    width: '180px',
  },
  { key: 'action', title: 'ACTION', dataType: DataType.String, width: '100px' },
];
const PublishPage = () => {
  const { tenantConfig, isLoading, error } = useTenantConfig();
  const router = useRouter();

  const [selectedKey, setSelectedKey] = useState('publish');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHeader, setShowHeader] = useState<boolean | null>(null);
  const filterOption: string[] = router.query.filterOptions
    ? JSON.parse(router.query.filterOptions as string)
    : [];
  const [filter, setFilter] = useState<string[]>(filterOption);
  const sort: string =
    typeof router.query.sort === 'string' ? router.query.sort : 'Modified On';
  const [sortBy, setSortBy] = useState(sort);
  const [contentList, setContentList] = React.useState([]);
  const [contentDeleted, setContentDeleted] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [data, setData] = React.useState<any[]>([]);
  const fetchContentAPI = useSharedStore((state: any) => state.fetchContentAPI);
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>(searchTerm);

  const prevFilterRef = useRef(filter);

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
  useEffect(() => {
    const filteredArray = contentList.map((item: any) => ({
      image: item?.appIcon || item?.posterImage || item?.appicon,
      contentType: item.primaryCategory,
      name: item.name,
      primaryCategory: item.primaryCategory,
      lastUpdatedOn: timeAgo(item.lastUpdatedOn),
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
  const handleSearch = (search: string) => {
    setSearchTerm(search.toLowerCase());
  };

  const handleFilterChange = (filter: string[]) => {
    setFilter(filter);
  };

  const handleSortChange = (sortBy: string) => {
    setSortBy(sortBy);
  };

  const openEditor = (content: any) => {
    const identifier = content?.identifier;
    const mode = 'read';
    if (content?.mimeType === MIME_TYPE.QUESTIONSET_MIME_TYPE) {
      router.push({ pathname: `/editor`, query: { identifier, mode } });
    } else if (
      content?.mimeType &&
      MIME_TYPE.GENERIC_MIME_TYPE.includes(content?.mimeType)
    ) {
      sessionStorage.setItem('previousPage', window.location.href);
      router.push({ pathname: `/upload-editor`, query: { identifier } });
    } else if (
      content?.mimeType &&
      MIME_TYPE.COLLECTION_MIME_TYPE.includes(content?.mimeType)
    ) {
      router.push({ pathname: `/collection`, query: { identifier, mode } });
    }
  };

  useEffect(() => {
    const getPublishContentList = async () => {
      try {
        if (!tenantConfig) return;
        setLoading(true);
        const query = debouncedSearchTerm || '';
        let offset = debouncedSearchTerm !== '' ? 0 : page * LIMIT;

        const primaryCategory = filter.length ? filter : [];
        if (prevFilterRef.current !== filter) {
          offset = 0;
          setPage(0);

          prevFilterRef.current = filter;
        }
        const order = sortBy === 'Created On' ? 'asc' : 'desc';
        const sort_by = { lastUpdatedOn: order };
        const response = await getContent(
          ['Live'],
          query,
          LIMIT,
          offset,
          primaryCategory,
          sort_by,
          tenantConfig?.CHANNEL_ID
        );
        const contentList = (response?.content || []).concat(
          response?.QuestionSet || []
        );
        setContentList(contentList);
        setTotalCount(response?.count);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getPublishContentList();
  }, [
    tenantConfig,
    debouncedSearchTerm,
    filter,
    sortBy,
    fetchContentAPI,
    contentDeleted,
    page,
  ]);

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
                Published
              </Typography>
            </Box>
            <Box mb={3}>
              <SearchBox
                placeholder="Search by title..."
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
              />
            </Box>
            {/* <Typography mb={2}>Here you see all your published content.</Typography> */}
            {loading ? (
              <Box display="flex" justifyContent="center" my={5}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Box className="table-ka-container">
                  <KaTableComponent
                    columns={columns}
                    data={data}
                    tableTitle="publish"
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

export default PublishPage;
